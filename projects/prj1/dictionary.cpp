/*Name: Aashrawat Shrestha
Email: ashrestha73@myseneca.ca
Student ID: 179413232
DATE: JAN30
move and copy I took a quick help from ai
*/
#include "dictionary.h"
#include "settings.h"
#include <fstream>
#include <iomanip>

namespace seneca {

    Dictionary::Dictionary() {};

    Dictionary::Dictionary(const char* filename) {
        std::ifstream file(filename);
        if (!file)
            return;

        std::string line;
        size_t count = 0;

        while (std::getline(file, line)) {
            if (!line.empty())
                ++count;
        }

        if (count == 0) return;

        m_words = new Word[count];
        m_size = count;

        
        file.clear();
        file.seekg(0);

        file.clear();
        file.seekg(0);

        size_t i = 0;
        while (std::getline(file, line)&&i<m_size) {
            std::string word, pos, def;
            size_t p1 = line.find(',');
            size_t p2 = line.find(',', p1 + 1);

            word = line.substr(0, p1);
            pos = (p2 != std::string::npos) ? line.substr(p1 + 1, p2 - p1 - 1) : "";
            def = (p2 != std::string::npos) ? line.substr(p2 + 1) : line.substr(p1 + 1);

            m_words[i].m_word = word;
            m_words[i].m_definition = def;
            m_words[i].m_pos = parsePOS(pos);

            ++i;
        }
    }
    Dictionary::~Dictionary() {
        delete[] m_words;
    }
    Dictionary::Dictionary(const Dictionary& other) {
        *this = other;
    }


    Dictionary& Dictionary::operator=(const Dictionary& other) {
        if (this != &other) {
            delete[] m_words;
            m_size = other.m_size;
            m_words = new Word[m_size];
            for (size_t i = 0; i < m_size; ++i)
                m_words[i] = other.m_words[i];
        }
        return *this;
    }

    Dictionary::Dictionary(Dictionary&& other) noexcept {
        *this = std::move(other);
    }

    Dictionary& Dictionary::operator=( Dictionary&& other) noexcept {
        if (this != &other) {
            delete[] m_words;

            m_words = other.m_words;
            m_size = other.m_size;

            other.m_words = nullptr;
            other.m_size = 0;
        }
        return *this;
    }

    PartOfSpeech Dictionary::parsePOS(const std::string& pos) const {
        if (pos == "n." || pos == "n. pl.") return PartOfSpeech::Noun;
        if (pos == "adv.") return PartOfSpeech::Adverb;
        if (pos == "a.") return PartOfSpeech::Adjective;
        if (pos == "v." || pos == "v. i." || pos == "v. t." || pos == "v. t. & i.") return PartOfSpeech::Verb;
        if (pos == "prep.") return PartOfSpeech::Preposition;
        if (pos == "pron.") return PartOfSpeech::Pronoun;
        if (pos == "conj.") return PartOfSpeech::Conjunction;
        if (pos == "interj.") return PartOfSpeech::Interjection;
        return PartOfSpeech::Unknown;
    }

    const char* Dictionary::posToString(PartOfSpeech pos) const {
        switch (pos) {
        case PartOfSpeech::Noun: return "noun";
        case PartOfSpeech::Pronoun: return "pronoun";
        case PartOfSpeech::Adjective: return "adjective";
        case PartOfSpeech::Adverb: return "adverb";
        case PartOfSpeech::Verb: return "verb";
        case PartOfSpeech::Preposition: return "preposition";
        case PartOfSpeech::Conjunction: return "conjunction";
        case PartOfSpeech::Interjection: return "interjection";
        default: return "";
        }
    }

    void Dictionary::searchWord(const char* word) const {
        bool found = false;
        size_t indent = std::string(word).length();

        for (size_t i = 0; i < m_size; ++i) {
            if (m_words[i].m_word == word) {
                if (!found) {
                    std::cout << m_words[i].m_word << " - ";
                }
                else {
                    std::cout << std::setw(indent) << " " << " - ";
                }

                if (g_settings.m_verbose && m_words[i].m_pos != PartOfSpeech::Unknown) {
                    std::cout << "(" << posToString(m_words[i].m_pos) << ") ";
                }

                std::cout << m_words[i].m_definition << std::endl;
                found = true;

                if (!g_settings.m_show_all)
                    return;
            }
        }

        if (!found) {
            std::cout << "Word '" << word << "' was not found in the dictionary." << std::endl;
        }
    }

}