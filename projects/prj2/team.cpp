/*Name: Aashrawat Shrestha
Email: ashrestha73@myseneca.ca
Student ID: 179413232
DATE: FEB10
*/
#include "team.h"

namespace seneca {

    // Default constructor
    Team::Team() = default;

    // Custom constructor
    Team::Team(const char* name)
        : m_name(name), m_members(nullptr), m_size(0) {
    }

    // Destructor
    Team::~Team() {
        for (size_t i = 0; i < m_size; ++i)
            delete m_members[i];
        delete[] m_members;
    }

    // Copy constructor
    Team::Team(const Team& other) {
        *this = other;
    }

    // Copy assignment
    Team& Team::operator=(const Team& other) {
        if (this != &other) {
            // cleanup
            for (size_t i = 0; i < m_size; ++i)
                delete m_members[i];
            delete[] m_members;

            m_name = other.m_name;
            m_size = other.m_size;
            m_members = nullptr;

            if (m_size > 0) {
                m_members = new Character * [m_size];
                for (size_t i = 0; i < m_size; ++i)
                    m_members[i] = other.m_members[i]->clone();
            }
        }
        return *this;
    }

    // Move constructor
    Team::Team(Team&& other) noexcept {
        *this = std::move(other);
    }

    // Move assignment
    Team& Team::operator=(Team&& other) noexcept {
        if (this != &other) {
            for (size_t i = 0; i < m_size; ++i)
                delete m_members[i];
            delete[] m_members;

            m_name = std::move(other.m_name);
            m_members = other.m_members;
            m_size = other.m_size;

            other.m_members = nullptr;
            other.m_size = 0;
        }
        return *this;
    }

    // Add member
    void Team::addMember(const Character* c) {
        if (!c) return;

        // check duplicate by name
        for (size_t i = 0; i < m_size; ++i) {
            if (m_members[i]->getName() == c->getName())
                return;
        }

        Character** temp = new Character * [m_size + 1];

        for (size_t i = 0; i < m_size; ++i)
            temp[i] = m_members[i];

        temp[m_size] = c->clone();

        delete[] m_members;
        m_members = temp;
        ++m_size;
    }

    // Remove member
    void Team::removeMember(const std::string& name) {
        for (size_t i = 0; i < m_size; ++i) {
            if (m_members[i]->getName() == name) {
                delete m_members[i];

                for (size_t j = i; j < m_size - 1; ++j)
                    m_members[j] = m_members[j + 1];

                --m_size;

                if (m_size == 0) {
                    delete[] m_members;
                    m_members = nullptr;
                }

                return;
            }
        }
    }

    // Index operator
    Character* Team::operator[](size_t idx) const {
        if (idx >= m_size)
            return nullptr;
        return m_members[idx];
    }

    // Show members
    void Team::showMembers() const {
        if (m_size == 0) {
            std::cout << "No team." << std::endl;
            return;
        }

        std::cout << "[Team] " << m_name << std::endl;
        for (size_t i = 0; i < m_size; ++i) {
            std::cout << "    " << i + 1 << ": "
                << *m_members[i] << std::endl;
        }
    }

}