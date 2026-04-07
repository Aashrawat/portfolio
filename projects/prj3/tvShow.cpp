/*Name: Aashrawat Shrestha
Email: ashrestha73@myseneca.ca
Student ID: 179413232
DATE: march29
Citation: I borrowed this tvShow.cpp code from my friend Enjal Bk from section NRA.
*/
#include "tvShow.h"
#include "settings.h"
#include <iomanip>
#include <algorithm>
#include <numeric>
#include <iterator>

namespace seneca
{
    TvShow::TvShow(const std::string& id, const std::string& title, unsigned short year, const std::string& summary)
        : MediaItem(title, summary, year), m_id(id)
    {
    }

    void TvShow::display(std::ostream& out) const
    {
        if (g_settings.m_tableView)
        {
            out << "S | ";
            out << std::left << std::setfill('.');
            out << std::setw(50) << this->getTitle() << " | ";
            out << std::right << std::setfill(' ');
            out << std::setw(2) << this->m_episodes.size() << " | ";
            out << std::setw(4) << this->getYear() << " | ";
            out << std::left;
            if (g_settings.m_maxSummaryWidth > -1)
            {
                if (static_cast<short>(this->getSummary().size()) <= g_settings.m_maxSummaryWidth)
                    out << this->getSummary();
                else
                    out << this->getSummary().substr(0, g_settings.m_maxSummaryWidth - 3) << "...";
            }
            else
                out << this->getSummary();
            out << std::endl;
        }
        else
        {
            size_t pos = 0;
            out << this->getTitle() << " [" << this->getYear() << "]\n";
            out << std::setw(this->getTitle().size() + 7) << std::setfill('-') << "" << '\n';
            while (pos < this->getSummary().size())
            {
                out << "    " << this->getSummary().substr(pos, g_settings.m_maxSummaryWidth) << '\n';
                pos += g_settings.m_maxSummaryWidth;
            }
            for (auto& item : m_episodes)
            {
                out << std::setfill('0') << std::right;
                out << "    " << 'S' << std::setw(2) << item.m_season
                    << 'E' << std::setw(2) << item.m_numberInSeason << ' ';
                if (item.m_title != "")
                    out << item.m_title << '\n';
                else
                    out << "Episode " << item.m_numberOverall << '\n';

                pos = 0;
                while (pos < item.m_summary.size())
                {
                    out << "            " << item.m_summary.substr(pos, g_settings.m_maxSummaryWidth - 8) << '\n';
                    pos += g_settings.m_maxSummaryWidth - 8;
                }
            }
            out << std::setw(this->getTitle().size() + 7) << std::setfill('-') << ""
                << std::setfill(' ') << '\n';
        }
    }

    TvShow* TvShow::createItem(const std::string& strShow)
    {
        if (strShow.empty() || strShow[0] == '#')
            throw "Not a valid show.";

        std::string record = strShow;
        std::string tokens[4];
        size_t start = 0;

        for (int i = 0; i < 3; ++i)
        {
            size_t next = record.find(',', start);
            if (next == std::string::npos)
                throw "Not a valid show.";
            tokens[i] = record.substr(start, next - start);
            MediaItem::trim(tokens[i]);
            start = next + 1;
        }

        tokens[3] = record.substr(start);
        MediaItem::trim(tokens[3]);

        return new TvShow(tokens[0], tokens[1], static_cast<unsigned short>(std::stoi(tokens[2])), tokens[3]);
    }

    double TvShow::getEpisodeAverageLength() const
    {
        if (m_episodes.empty())
            return 0.0;

        auto total = std::accumulate(m_episodes.begin(), m_episodes.end(), 0u,
            [](unsigned int sum, const TvEpisode& ep)
            {
                return sum + ep.m_length;
            });

        return static_cast<double>(total) / m_episodes.size();
    }

    std::list<std::string> TvShow::getLongEpisodes() const
    {
        std::vector<TvEpisode> filtered{};
        std::copy_if(m_episodes.begin(), m_episodes.end(), std::back_inserter(filtered),
            [](const TvEpisode& ep)
            {
                return ep.m_length >= 3600;
            });

        std::list<std::string> result{};
        std::transform(filtered.begin(), filtered.end(), std::back_inserter(result),
            [](const TvEpisode& ep)
            {
                return ep.m_title.empty() ? (std::string("Episode ") + std::to_string(ep.m_numberOverall)) : ep.m_title;
            });

        return result;
    }
}